from google.cloud import compute_v1
from google.oauth2 import service_account
import subprocess
import json
import tempfile
import os
import threading


class GoogleCloud:
    def __init__(self, console_logger, project_id="", zone="", instance_name="", ssh_username=""):
        # Set the path to your JSON key file
        with open('config/login.json', 'r') as f:
            self.credentials_data = f.read()
            self.credentials_data = json.loads(self.credentials_data)

        # https://console.cloud.google.com/iam-admin/serviceaccounts
        self.console_logger = console_logger
        self.credentials = service_account.Credentials.from_service_account_file(
            './config/login.json')

        # Create a Compute Engine client
        self.compute_client = compute_v1.InstancesClient(
            credentials=self.credentials)
        self.zones_client = compute_v1.ZonesClient(
            credentials=self.credentials)

        self.gcloud_cmd = os.getenv(
            'LOCALAPPDATA') + "\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd"
        with open('config/login.json', 'r') as f:
            login_data = f.read()
            login_data = json.loads(login_data)

        # Define the project ID, zone, and instance name
        self.project_id = login_data["project_id"]
        self.instances = None
        # self.zone = zone
        # self.instance_name = instance_name
        # self.ssh_username = ssh_username

        # Initialize 'self.instances'
        # self.instances = self.compute_client.list(project=self.project_id)

        # if instance_name not in [instance.name for instance in self.instances]:
        #     print(f"Instance {instance_name} does not exist.")

        #     return
    def load_instances(self):
        all_instances = []
        threads = []
        zones = self.zones_client.list(project=self.project_id)

        def process_zone(zone):
            instances = self.compute_client.list(
                project=self.project_id, zone=zone.name)
            for instance in instances:
                machine = instance.machine_type.split("/zones/")[1]
                zone_type = machine.split("/machineTypes/")[0]
                machine_type = machine.split("/machineTypes/")[1]

                # Initialize net_i_p as None or a default value
                net_i_p = None
                if instance.network_interfaces and instance.network_interfaces[0].access_configs:
                    net_i_p = instance.network_interfaces[0].access_configs[0].nat_i_p

                instance_dict = {
                    "id": instance.id,
                    "name": instance.name,
                    "zone": zone_type,
                    "status": instance.status,
                    "machine_type": machine_type,
                    "disk_size": instance.disks[0].disk_size_gb if instance.disks else None,
                    "creation": instance.creation_timestamp,
                    "last_start": instance.last_start_timestamp,
                    "last_stop": instance.last_stop_timestamp,
                    "net_i_p": net_i_p,
                }
                all_instances.append(instance_dict)

        # Create a thread for each zone
        for zone in zones:
            thread = threading.Thread(target=process_zone, args=(zone,))
            threads.append(thread)
            thread.start()

        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        if self.instances:
            if self.instances != all_instances:
                self.console_logger("New Instance Found")
        else:
            self.console_logger("Loading Instances")
        self.instances = all_instances
        return all_instances
        # all_instances.append(instance.to_dict())

        # Convert the list of instances to a JSON string
        # return json.dumps(all_instances, indent=4)

    def authenticate(self):
        # Run the command
        path = os.getenv('LOCALAPPDATA')
        subprocess.run([path + "\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd",
                       "auth", "application-default", "login"], check=True)

    def stop_instance(self, instance_name):
        self.console_logger(f"Stopping instance...", instance_name=instance_name)
        
        # Find the instance you want to stop
        for instance in self.instances:
            if instance["name"] == instance_name:
                # Check if the instance is running
                if instance["status"] == "RUNNING":
                    print(f"Stopping instance: {instance['name']}")
                    operation = self.compute_client.stop(
                        project=self.project_id,
                        zone=instance["zone"],
                        instance=instance["name"]
                    )
                    operation_result = operation.result()
                    self.console_logger(f"Instance stopped successfully: {operation_result}", instance_name=instance_name, zone=instance["zone"], ssh_username=instance["ssh_username"])
                else:
                    self.console_logger(f"Instance {instance['name']} is already stopped.", instance_name=instance_name, zone=instance["zone"], ssh_username=instance["ssh_username"])
                break

    def start_instance(self, instance_name):
        self.console_logger(f"Starting instance...", instance_name=instance_name)
        
        # Find the instance you want to start
        for instance in self.instances:
            if instance["name"] == instance_name:
                # Check if the instance is not running
                if instance["status"] != "RUNNING":
                    print(f"Starting instance: {instance['name']}")
                    operation = self.compute_client.start(
                        project=self.project_id,
                        zone=instance["zone"],
                        instance=instance["name"]
                    )
                    operation_result = operation.result()
                    self.console_logger(f"Instance started successfully: {operation_result}", instance_name=instance_name, zone=instance["zone"], ssh_username=instance["ssh_username"])
                else:
                    # print(f"Instance {instance['name']} is already running.")
                    self.console_logger(f"Instance {instance['name']} is already running.", instance_name=instance_name, zone=instance["zone"], ssh_username=instance["ssh_username"])
                break

    def upload_file_to_instance(self, ssh_username, zone, instance_name, file, serverType, remote_path):
        # try:
        
        self.console_logger(f"Creating directory {remote_path} on {instance_name}...", instance_name=instance_name, zone=zone, ssh_username=ssh_username)
        cmd = [
            self.gcloud_cmd, "compute", "ssh",
            f"{ssh_username}@{instance_name}",
            "--zone", zone,
            "--command", f"sudo mkdir -p '{remote_path}'"
        ]
        result = subprocess.run(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if result.stderr:
            self.console_logger(f"An error occurred while creating the directory: {result.stderr}", instance_name=instance_name, zone=zone, ssh_username=ssh_username)
            return False, cmd
        else:
            self.console_logger(f"Created directory {remote_path} on {instance_name}...", instance_name=instance_name, zone=zone, ssh_username=ssh_username)
        # print(f"Running command: {cmd}")        
        
        self.console_logger(f"Enabling permissions of {remote_path} on {instance_name}...", instance_name=instance_name, zone=zone, ssh_username=ssh_username)
        cmd = [
            self.gcloud_cmd, "compute", "ssh",
            f"{ssh_username}@{instance_name}",
            "--zone", zone,
            "--command", f"sudo chmod 777 '{remote_path}'"
        ]
        result = subprocess.run(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if result.stderr:
            self.console_logger(f"An error occurred while enabling permissions: {result.stderr}", instance_name=instance_name, zone=zone, ssh_username=ssh_username)
            return False, cmd
        else:
            self.console_logger(f"Enabled permissions of {remote_path} on {instance_name}...", instance_name=instance_name, zone=zone, ssh_username=ssh_username)
        
        self.console_logger(f"Copying {serverType} file: {file} to {instance_name}...", instance_name=instance_name, zone=zone, ssh_username=ssh_username)
        cmd = f"{self.gcloud_cmd} compute scp mods/{serverType}/{file} {ssh_username}@{instance_name}:{remote_path} --zone {zone} --project {self.project_id}"
        result = subprocess.run(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if result.stderr:
            self.console_logger(f"An error occurred while copying the file: {result.stderr}", instance_name=instance_name, zone=zone, ssh_username=ssh_username)
            return False, cmd
        else:
            self.console_logger(f"Copied {serverType} file: {file} to {instance_name}...", instance_name=instance_name, zone=zone, ssh_username=ssh_username)

        # cmd = f"gcloud compute scp {tmp_file} {ssh_username}@{instance_name}:{remote_path}/{file.name} --zone {zone} --command 'sudo unzip {remote_path} -d /home/{ssh_username}/'"
        # subprocess.run(cmd, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        self.console_logger(f"Unzipping {serverType} file: {file}", instance_name=instance_name, zone=zone, ssh_username=ssh_username)
        # Unzip the file into the remote directory
        cmd = [
            self.gcloud_cmd, "compute", "ssh",
            f"{ssh_username}@{instance_name}",
            "--zone", zone,
            "--command", f"sudo unzip '{remote_path}/{file}' -d '{remote_path}'"
        ]
        
        result = subprocess.run(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        if result.stderr:
            self.console_logger(f"An error occurred while unzipping the file: {result.stderr}", instance_name=instance_name, zone=zone, ssh_username=ssh_username)
            return False, cmd
        else:
            self.console_logger(f"Unzipped {serverType} file: {file}", instance_name=instance_name, zone=zone, ssh_username=ssh_username)
        self.console_logger
        # Run the install script
        cmd = [
            self.gcloud_cmd, "compute", "ssh",
            f"{ssh_username}@{instance_name}",
            "--zone", zone,
            "--command", f"sudo chmod +x {remote_path}/Install.sh && cd {remote_path} && sudo ./Install.sh && sudo chmod +x /ServerStart.sh && sudo ./Start.sh"
        ]
        
        
        result = subprocess.run(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        if result.stderr:
            self.console_logger(f"An error occurred while starting the server: {result.stderr}", instance_name=instance_name, zone=zone, ssh_username=ssh_username)
            return False, cmd
        else:
            self.console_logger(f"Server been successfully installed and started.", instance_name=instance_name, zone=zone, ssh_username=ssh_username)
            self.console_logger(result.stdout, instance_name=instance_name, zone=zone, ssh_username=ssh_username)


        # except subprocess.CalledProcessError as e:
        #     print(f"An error occurred while copying the script: {e.stderr}")
        # finally:
        #     if os.path.exists(tmp_file.name):
        #         os.remove(tmp_file.name)

    def install_vanilla_minecraft(self, ssh_username, zone, instance_name, file):
        remote_path = f"/home/{ssh_username}/minecraft"
        self.console_logger(f"Creating directory {remote_path} on {instance_name}...", instance_name=instance_name, zone=zone, ssh_username=ssh_username)

        cmd = [
            self.gcloud_cmd, "compute", "ssh",
            f"{ssh_username}@{instance_name}",
            "--zone", zone,
            "--command", f"sudo mkdir -p '{remote_path}'"
        ]

    def create_instance(self, console_logger, machine_type="e2-standard-2", disk_size_gb=10, image_project="ubuntu-os-cloud", image_family="ubuntu-2004-lts", zone="", instance_name="", ssh_username=""):
        """
        Create a new Google Compute Engine instance with specified specifications.
        """
        try:
            # Configure the machine
            machine_type_full_path = f"zones/{zone}/machineTypes/{machine_type}"
            disk = compute_v1.AttachedDisk()
            disk.initialize_params.disk_size_gb = disk_size_gb
            disk.initialize_params.source_image = f"projects/{image_project}/global/images/family/{image_family}"
            disk.auto_delete = True
            disk.boot = True
            network_interface = compute_v1.NetworkInterface()
            network_interface.name = "global/networks/default"

            # Prepare the instance configuration
            instance = compute_v1.Instance()
            instance.name = instance_name
            instance.machine_type = machine_type_full_path
            instance.disks = [disk]
            instance.network_interfaces = [network_interface]

            # Create the instance
            operation = self.compute_client.insert(
                project=self.project_id, zone=zone, instance_resource=instance)
            operation_result = operation.result()
            # print(f"Operation status: {operation_result}")
            console_logger(f"Instance Starting...", instance_name=instance_name, zone=zone, ssh_username=ssh_username)
            return operation_result
        except subprocess.CalledProcessError as e:
            console_logger(f"An error occurred while creating the instance: {e.stderr}", instance_name=instance_name, zone=zone, ssh_username=ssh_username)
            

    def set_project(self):
        try:
            # Use subprocess to run the gcloud command to set the project
            cmd = f"gcloud config set project {self.project_id}"
            subprocess.run(cmd, shell=True, check=True,
                           stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

            print(f"Project set to {self.project_id}")
        except subprocess.CalledProcessError as e:
            print(f"An error occurred while setting the project: {e.stderr}")

    def copy_script_to_instance(self, script_path, remote_path):
        try:
            # Use gcloud compute scp to copy the script to the remote instance
            cmd = f"gcloud compute scp {script_path} {self.ssh_username}@{self.instance_name}:{remote_path} --zone {self.zone}"
            subprocess.run(cmd, shell=True, check=True,
                           stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

            print(f"Script copied to {self.instance_name} at {remote_path}")
        except subprocess.CalledProcessError as e:
            print(f"An error occurred while copying the script: {e.stderr}")

    def execute_bash_script(self, remote_script_path):
        self.instances = self.compute_client.list(
            project=self.project_id, zone=self.zone)

        for instance in self.instances:
            if instance.name == self.instance_name:
                self.instance_ip = instance.network_interfaces[0].access_configs[0].nat_i_p

                print(
                    f"Executing bash script on {self.instance_name} @ {self.instance_ip}...")

                try:
                    # Use gcloud compute ssh to execute the script remotely
                    cmd = f"gcloud compute ssh {self.ssh_username}@{self.instance_name} --zone {self.zone} --command 'sudo {remote_script_path}'"
                    subprocess.run(cmd, shell=True, check=True,
                                   stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

                except subprocess.CalledProcessError as e:
                    print(f"An error occurred: {e.stderr}")
